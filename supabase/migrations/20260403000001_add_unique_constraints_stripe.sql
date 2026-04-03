-- Migration: add missing UNIQUE constraints required by Stripe upsert operations
-- Date: 2026-04-03
-- Context: webhook upsert(onConflict: 'user_id') and confirm-session upsert(onConflict: 'user_id,destination')
--          were failing with 42P10 because these UNIQUE constraints didn't exist.

-- Required by: webhook.helpers.ts → buildCheckoutCompletedUpsert → upsert onConflict: 'user_id'
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Required by: confirm-session/route.ts → destination_purchases upsert onConflict: 'user_id,destination'
ALTER TABLE public.destination_purchases
  ADD CONSTRAINT destination_purchases_user_id_destination_unique UNIQUE (user_id, destination);
