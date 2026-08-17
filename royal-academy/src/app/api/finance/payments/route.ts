import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentFeeId, amount, method, reference } = await request.json();
    if (!studentFeeId || !amount || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (method === 'ONLINE' && reference) {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (secretKey) {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${secretKey}`
          }
        });
        const verifyData = await verifyRes.json();
        
        if (!verifyData.status || verifyData.data.status !== 'success') {
          return NextResponse.json({ error: 'Payment verification failed with Paystack' }, { status: 400 });
        }
        
        // Note: Paystack amounts are in kobo. verifyData.data.amount / 100
        const paystackAmount = verifyData.data.amount / 100;
        if (Math.abs(paystackAmount - numAmount) > 0.01) {
           return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
        }
      }
    }

    const fee = await prisma.studentFee.findUnique({ where: { id: studentFeeId } });
    if (!fee) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const newAmountPaid = fee.amountPaid + numAmount;
    let status = 'PENDING';
    if (newAmountPaid > 0 && newAmountPaid < fee.amountDue) status = 'PARTIAL';
    if (newAmountPaid >= fee.amountDue) status = 'PAID';

    const result = await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentFeeId,
          amount: numAmount,
          method,
          reference,
          status: 'SUCCESS'
        }
      }),
      prisma.studentFee.update({
        where: { id: studentFeeId },
        data: {
          amountPaid: newAmountPaid,
          status
        }
      })
    ]);

    return NextResponse.json({ success: true, payment: result[0], updatedFee: result[1] });
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
