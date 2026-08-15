<?php

namespace App\Modules\Shared\Domain\Enums;

enum WalletTransactionType: string
{
    case CREDIT_EARNINGS = 'credit_earnings';
    case CREDIT_SETTLEMENT = 'credit_settlement';
    case CREDIT_ADJUSTMENT = 'credit_adjustment';
    case DEBIT_COMMISSION = 'debit_commission';
    case DEBIT_REFUND = 'debit_refund';
    case DEBIT_WITHDRAWAL = 'debit_withdrawal';
    case DEBIT_ADJUSTMENT = 'debit_adjustment';
}
