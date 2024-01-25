import {getPaginationVariables, Pagination, Image} from '@shopify/hydrogen';
import {useLoaderData, Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {useVariantUrl} from '~/utils';

export async function loader({context, request}) {
  const variables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const {products} = await context.storefront.query(ALL_PRODUCTS_QUERY, {
    variables,
  });

  return json({
    products,
  });
}

export default function () {
  const {products} = useLoaderData();

  return (
    <Pagination connection={products}>
      {({nodes, NextLink, PreviousLink, isLoading}) => (
        <>
          <PreviousLink>
            {isLoading ? 'Loading...' : 'Load previous products'}
          </PreviousLink>
          <ProductsGrid products={nodes} />
          <NextLink>{isLoading ? 'Loading...' : 'Load next products'}</NextLink>
        </>
      )}
    </Pagination>
  );
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({products}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  console.log(product);
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {variant.image && (
        <Image
          alt={variant.image.altText || product.title}
          aspectRatio="1/1"
          data={variant.image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
    </Link>
  );
}

const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    publishedAt
    handle
    vendor
    variants(first: 1) {
      nodes {
        id
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
`;

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
