import {Suspense} from 'react';
import renderHydrogen from '@shopify/hydrogen/entry-server';
import {
  FileRoutes,
  PerformanceMetrics,
  PerformanceMetricsDebug,
  Route,
  Router,
  ShopifyAnalytics,
  ShopifyProvider,
  CartProvider,
  useSession,
  useServerAnalytics,
  Seo,
  gql
} from '@shopify/hydrogen';
import {HeaderFallback, EventsListener} from '~/components';
import {NotFound} from '~/components/index.server';

function App({request}) {
  const pathname = new URL(request.normalizedUrl).pathname;
  const localeMatch = /^\/([a-z]{2})(\/|$)/i.exec(pathname);
  const countryCode = localeMatch ? localeMatch[1] : undefined;

  const isHome = pathname === `/${countryCode ? countryCode + '/' : ''}`;

  const {customerAccessToken} = useSession();

  useServerAnalytics({
    shopify: {
      isLoggedIn: !!customerAccessToken,
    },
  });

  // https://shopify.dev/api/hydrogen/components/cart/cartprovider
  const cartFrag = gql`
    fragment CartFragment on Cart {
      id
      checkoutUrl
      totalQuantity
      buyerIdentity {
        countryCode
        customer {
          id
          email
          firstName
          lastName
          displayName
        }
        email
        phone
      }
      lines(first: $numCartLines) {
        edges {
          node {
            id
            quantity
            attributes {
              key
              value
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              compareAtAmountPerQuantity {
                amount
                currencyCode
              }
            }
            sellingPlanAllocation {
              sellingPlan {
                id
                name
                options {
                  name
                  value
                }
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                availableForSale
                compareAtPriceV2 {
                  ...MoneyFragment
                }
                priceV2 {
                  ...MoneyFragment
                }
                requiresShipping
                title
                image {
                  ...ImageFragment
                }
                product {
                  vendor
                  id
                  handle
                  title
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          ...MoneyFragment
        }
        totalAmount {
          ...MoneyFragment
        }
        totalDutyAmount {
          ...MoneyFragment
        }
        totalTaxAmount {
          ...MoneyFragment
        }
      }
      note
      attributes {
        key
        value
      }
      discountCodes {
        code
      }
    }
    fragment MoneyFragment on MoneyV2 {
      currencyCode
      amount
    }
    fragment ImageFragment on Image {
      id
      url
      altText
      width
      height
    }
  `;

  return (
    <Suspense fallback={<HeaderFallback isHome={isHome} />}>
      <EventsListener />
      <ShopifyProvider countryCode={countryCode}>
        <Seo
          type="defaultSeo"
          data={{
            title: 'Hydrogen',
            description:
              "A custom storefront powered by Hydrogen, Shopify's React-based framework for building headless.",
            titleTemplate: `%s · Hydrogen`,
          }}
        />
        <CartProvider
          countryCode={countryCode}
          customerAccessToken={customerAccessToken}
          cartFragment={cartFrag}
        >
          <Router>
            <FileRoutes
              basePath={countryCode ? `/${countryCode}/` : undefined}
            />
            <Route path="*" page={<NotFound />} />
          </Router>
        </CartProvider>
        <PerformanceMetrics />
        {import.meta.env.DEV && <PerformanceMetricsDebug />}
        <ShopifyAnalytics cookieDomain="hydrogen.shop" />
      </ShopifyProvider>
    </Suspense>
  );
}

export default renderHydrogen(App);
