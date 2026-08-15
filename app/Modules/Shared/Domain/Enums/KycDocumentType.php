<?php

namespace App\Modules\Shared\Domain\Enums;

enum KycDocumentType: string
{
    case CITIZENSHIP_FRONT = 'citizenship_front';
    case CITIZENSHIP_BACK = 'citizenship_back';
    case BUSINESS_REGISTRATION = 'business_registration';
    case PAN_VAT = 'pan_vat';
    case TAX_CLEARANCE = 'tax_clearance';
    case PROFILE = 'profile';
}
