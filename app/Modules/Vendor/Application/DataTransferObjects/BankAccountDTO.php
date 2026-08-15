<?php

namespace App\Modules\Vendor\Application\DataTransferObjects;

final class BankAccountDTO
{
    public function __construct(
        public readonly string $bank_name,
        public readonly ?string $branch_name,
        public readonly string $account_name,
        public readonly string $account_number,
        public readonly string $account_type,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            bank_name: $data['bank_name'],
            branch_name: $data['branch_name'] ?? null,
            account_name: $data['account_name'],
            account_number: $data['account_number'],
            account_type: $data['account_type'] ?? 'savings',
        );
    }
}
