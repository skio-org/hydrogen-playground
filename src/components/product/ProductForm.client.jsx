import {useEffect, useCallback, useState} from 'react';

import {
  useProductOptions,
  isBrowser,
  useUrl,
  AddToCartButton,
  Money,
  ShopPayButton,
} from '@shopify/hydrogen';

import {Heading, Text, Button, ProductOptions} from '~/components';

import loadable from '@loadable/component';
const SkioPlanPicker = loadable(() => import('~/components/skio/SkioPlanPicker.client'), { 
  ssr: false,
  fallback: <div>Loading...</div>,
});

export function ProductForm({ product }) {
  const {pathname, search} = useUrl();
  const [params, setParams] = useState(new URLSearchParams(search));

  const {options, setSelectedOption, selectedOptions, selectedVariant} =
    useProductOptions();

  const [subscription, setSubscription] = useState(null);

  const isOutOfStock = !selectedVariant?.availableForSale || false;
  const isOnSale =
    selectedVariant?.priceV2?.amount <
      selectedVariant?.compareAtPriceV2?.amount || false;

  useEffect(() => {
    if (params || !search) return;
    setParams(new URLSearchParams(search));
  }, [params, search]);

  useEffect(() => {
    options.map(({name, values}) => {
      if (!params) return;
      const currentValue = params.get(name.toLowerCase()) || null;
      if (currentValue) {
        const matchedValue = values.filter(
          (value) => encodeURIComponent(value.toLowerCase()) === currentValue,
        );
        setSelectedOption(name, matchedValue[0]);
      } else {
        params.set(
          encodeURIComponent(name.toLowerCase()),
          encodeURIComponent(selectedOptions[name].toLowerCase()),
        ),
          window.history.replaceState(
            null,
            '',
            `${pathname}?${params.toString()}`,
          );
      }
    });
  }, []);

  const handleChange = useCallback(
    (name, value) => {
      setSelectedOption(name, value);
      if (!params) return;
      params.set(
        encodeURIComponent(name.toLowerCase()),
        encodeURIComponent(value.toLowerCase()),
      );
      if (isBrowser()) {
        window.history.replaceState(
          null,
          '',
          `${pathname}?${params.toString()}`,
        );
      }
    },
    [setSelectedOption, params, pathname],
  );

  // Returns { sellingPlan, priceV2, discount } or null
  const onPlanChange = async(subscription) => {
    setSubscription(subscription);
  }

  return (
    <form className="grid gap-10">
      <SkioPlanPicker product={ product } selectedVariant={ selectedVariant } onPlanChange={ onPlanChange }></SkioPlanPicker>

      {
        <div className="grid gap-4">
          {options.map(({name, values}) => {
            if (values.length === 1) {
              return null;
            }
            return (
              <div
                key={name}
                className="flex flex-col flex-wrap mb-4 gap-y-2 last:mb-0"
              >
                <Heading as="legend" size="lead" className="min-w-[4rem]">
                  {name}
                </Heading>
                <div className="flex flex-wrap items-baseline gap-4">
                  <ProductOptions
                    name={name}
                    handleChange={handleChange}
                    values={values}
                  />
                </div>
              </div>
            );
          })}
        </div>
      }
      <div className="grid items-stretch gap-4">
        <AddToCartButton
          variantId={selectedVariant?.id}
          sellingPlanId={subscription?.sellingPlan?.id}
          quantity={1}
          accessibleAddingToCartLabel="Adding item to your cart"
          disabled={isOutOfStock}
          type="button"
        >
          <Button
            width="full"
            variant={isOutOfStock ? 'secondary' : 'primary'}
            as="span"
          >
            {isOutOfStock ? (
              <Text>Sold out</Text>
            ) : (
              <Text
                as="span"
                className="flex items-center justify-center gap-2"
              >
                <span>{ subscription ? 'Subscription' : 'Add to bag' }</span> <span>·</span>{' '}
                <Money
                  withoutTrailingZeros
                  data={subscription ? subscription.pricev2 : selectedVariant.priceV2}
                  as="span"
                />
                {isOnSale ? (
                  <Money
                    withoutTrailingZeros
                    data={selectedVariant.compareAtPriceV2}
                    as="span"
                    className="opacity-50 strike"
                  />
                ): (subscription && subscription.pricev2.amount < selectedVariant.priceV2.amount) && (
                  <Money
                    withoutTrailingZeros
                    data={selectedVariant.priceV2}
                    as="span"
                    className="opacity-50 strike"
                  />
                )}
              </Text>
            )}
          </Button>
        </AddToCartButton>
        {!isOutOfStock && <ShopPayButton variantIds={[selectedVariant.id]} />}
      </div>
    </form>
  );
}
