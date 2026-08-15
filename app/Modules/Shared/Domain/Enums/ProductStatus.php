<?php

namespace App\Modules\Shared\Domain\Enums;

enum ProductStatus: string
{
    case DRAFT = 'draft';
    case PENDING_REVIEW = 'pending_review';
    case PUBLISHED = 'published';
    case OUT_OF_STOCK = 'out_of_stock';
    case HIDDEN = 'hidden';
    case ARCHIVED = 'archived';
}
