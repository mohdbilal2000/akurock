import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';

// Database not configured — sync operates in stub mode
const prisma: any = null;
if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL not set - database sync disabled');
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 requests per minute per IP
    const ip = getClientIP(request.headers);
    const { success } = rateLimit(`admin-sync:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check if database is available
    if (!prisma) {
      return NextResponse.json(
        { 
          error: 'Database unavailable', 
          message: 'Database connection not configured. Products saved to localStorage only.',
          results: { created: 0, updated: 0, errors: [] }
        },
        { status: 503 } // Service Unavailable
      );
    }

    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Invalid request: products array is required' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const productData of products) {
      try {
        // Extract and transform product data
        const productInput = {
          productId: productData.productId,
          variantId: productData.variantId,
          name: productData.name,
          slug: productData.slug,
          handle: productData.handle || null,
          type: productData.type || null,
          description: productData.description || null,
          stone: productData.stone || null,
          altText: productData.alt_text || null,
          category: productData.category || null,
          price: parseFloat(productData.priceValue || productData.price?.replace(/[^0-9.]/g, '') || '0'),
          priceValue: parseFloat(productData.priceValue || productData.price?.replace(/[^0-9.]/g, '') || '0'),
          currency: productData.currency || 'EUR',
          stock: productData.stock || 0,
          images: productData.images || [],
          mainImage: productData.mainImage || null,
          specialImage: productData.special_image || null,
          specialImage2: productData.special_image_2 || null,
          hoverImage: productData.hover_image || null,
          hoverImageInstallation: productData.hover_image_installation || null,
          selectionSliderImage: productData.selection_slider_image || null,
          color: productData.color || null,
          buttonHeaderColor: productData.button_header_color || null,
          specialFieldSlogan: productData.special_field_slogan || null,
          specialFieldText: productData.special_field_text || null,
          specialFieldButton: productData.special_field_button || null,
        };

        // Upsert product (create or update)
        const product = await prisma.product.upsert({
          where: { productId: productInput.productId },
          update: productInput,
          create: productInput,
        });

        if (product) {
          // Check if this was an update or create by checking createdAt vs updatedAt
          const wasCreated = product.createdAt.getTime() === product.updatedAt.getTime();
          if (wasCreated) {
            results.created++;
          } else {
            results.updated++;
          }
        }
      } catch (error: any) {
        const errorMsg = `Error syncing product ${productData.name || productData.productId}: ${error.message}`;
        console.error(errorMsg, error);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${products.length} products`,
      results,
    });
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.message?.includes('Prisma') || error.message?.includes('database') || error.message?.includes('connect')) {
      console.warn('Database connection error - sync unavailable');
      return NextResponse.json(
        { 
          error: 'Database unavailable', 
          message: 'Database connection failed. Products saved to localStorage only.',
          results: { created: 0, updated: 0, errors: [] }
        },
        { status: 503 }
      );
    }
    
    console.error('Error in sync-products API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if database is available
    if (!prisma) {
      return NextResponse.json(
        { 
          error: 'Database unavailable', 
          message: 'Database connection not configured.',
          products: []
        },
        { status: 503 }
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.message?.includes('Prisma') || error.message?.includes('database') || error.message?.includes('connect')) {
      console.warn('Database connection error - fetch unavailable');
      return NextResponse.json(
        { 
          error: 'Database unavailable', 
          message: 'Database connection failed.',
          products: []
        },
        { status: 503 }
      );
    }
    
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
