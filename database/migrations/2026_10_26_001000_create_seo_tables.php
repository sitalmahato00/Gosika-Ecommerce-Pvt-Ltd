<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // seo_meta - per-entity SEO overrides (polymorphic)
        Schema::create('seo_meta', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('entity_type', 50); // product|category|store|cms_page|homepage
            $table->unsignedBigInteger('entity_id')->nullable(); // nullable for homepage
            $table->string('meta_title', 200)->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('meta_keywords', 500)->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('robots', 100)->default('index,follow');
            $table->string('og_title', 200)->nullable();
            $table->string('og_description', 500)->nullable();
            $table->string('og_image', 500)->nullable();
            $table->string('twitter_card', 20)->default('summary_large_image');
            $table->string('twitter_title', 200)->nullable();
            $table->string('twitter_description', 500)->nullable();
            $table->boolean('is_noindex')->default(false);
            $table->boolean('is_nofollow')->default(false);
            $table->json('structured_data')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['entity_type', 'entity_id']);
        });

        // seo_templates - templates for auto-generating SEO
        Schema::create('seo_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('entity_type', 50); // product|category|store|page
            $table->string('name', 100);
            $table->string('title_template', 300);
            $table->string('description_template', 600)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        // seo_keywords - keyword library
        Schema::create('seo_keywords', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('keyword', 200);
            $table->string('language', 10)->default('en');
            $table->string('search_intent', 30)->nullable(); // informational|navigational|transactional|commercial
            $table->string('entity_type', 50)->nullable();
            $table->tinyInteger('priority')->default(5);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index('keyword');
        });

        // seo_redirects - 301/302 redirects
        Schema::create('seo_redirects', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('source_path', 500);
            $table->string('target_path', 500);
            $table->smallInteger('redirect_type')->default(301);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('hit_count')->default(0);
            $table->timestamp('last_hit_at')->nullable();
            $table->string('notes', 255)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique('source_path');
        });

        // seo_audit_results - audit findings
        Schema::create('seo_audit_results', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_url', 500)->nullable();
            $table->string('issue_type', 80);
            $table->string('severity', 20); // info|warning|error
            $table->text('description');
            $table->text('recommendation')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['severity', 'is_resolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_audit_results');
        Schema::dropIfExists('seo_redirects');
        Schema::dropIfExists('seo_keywords');
        Schema::dropIfExists('seo_templates');
        Schema::dropIfExists('seo_meta');
    }
};
