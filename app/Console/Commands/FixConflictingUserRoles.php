<?php

namespace App\Console\Commands;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Console\Command;

class FixConflictingUserRoles extends Command
{
    protected $signature = 'users:fix-conflicting-roles {--dry-run : Show what would be changed without making actual changes}';

    protected $description = 'Fix users who have both admin/staff roles AND customer role - removes customer role from staff users';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        // Get all users with roles
        $users = User::with('roles')->get();
        
        $fixedCount = 0;
        $issuesFound = [];

        foreach ($users as $user) {
            $roleNames = $user->roles->pluck('name')->toArray();
            
            // Check if user has customer role
            $hasCustomer = in_array('customer', $roleNames);
            
            // Check if user has any admin/staff roles (anything except customer and vendor_admin)
            $staffRoles = array_diff($roleNames, ['customer', 'vendor_admin']);
            $hasStaffRole = !empty($staffRoles);
            
            // Check if user has vendor role
            $hasVendor = in_array('vendor_admin', $roleNames);
            
            // Issue 1: User has BOTH staff roles AND customer role
            if ($hasCustomer && $hasStaffRole) {
                $issuesFound[] = [
                    'type' => 'staff_with_customer',
                    'user' => $user,
                    'roles' => $roleNames,
                    'staff_roles' => $staffRoles,
                ];
                
                $this->warn("⚠️  {$user->full_name} ({$user->email})");
                $this->line("   Current roles: " . implode(', ', $roleNames));
                $this->line("   Issue: Has staff roles but also has 'customer' role");
                $this->line("   Fix: Remove 'customer' role");
                
                if (!$isDryRun) {
                    // Remove only customer role, keep all staff roles
                    $user->syncRoles($staffRoles);
                    $this->info("   ✓ Fixed: Customer role removed");
                }
                
                $this->newLine();
                $fixedCount++;
            }
            
            // Issue 2: User has BOTH vendor AND customer role (optional check)
            elseif ($hasVendor && $hasCustomer && !$hasStaffRole) {
                $this->line("ℹ️  {$user->full_name} ({$user->email})");
                $this->line("   Has both: vendor_admin, customer");
                $this->line("   Note: This might be intentional (vendors can also shop)");
                $this->newLine();
            }
        }

        if ($fixedCount === 0) {
            $this->info('✓ No conflicting roles found. All users have proper role assignments.');
            return self::SUCCESS;
        }

        if ($isDryRun) {
            $this->newLine();
            $this->info("Found {$fixedCount} user(s) with conflicting roles.");
            $this->info('Run without --dry-run to apply fixes.');
        } else {
            $this->newLine();
            $this->info("✓ Fixed {$fixedCount} user(s) with conflicting roles.");
        }

        return self::SUCCESS;
    }
}

