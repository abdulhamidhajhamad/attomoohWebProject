import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductRepository } from './repositories/product.repository.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductDocument } from './schemas/product.schema.js';
import { CategoriesService } from '../categories/categories.service.js';
import {
  CloudinaryService,
  CloudinaryUploadResult,
} from '../cloudinary/cloudinary.service.js';
import { makeBilingual } from '../common/utils/translate.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly MAX_IMAGES = 10;
  private readonly UPLOAD_FOLDER = 'attomooh/products';

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<ProductDocument> {
    // ── Validate all categories exist ──
    const categoryIds = await Promise.all(
      createProductDto.categories.map(async (catId) => {
        const oid = new Types.ObjectId(catId);
        await this.categoriesService.findById(oid);
        return oid;
      }),
    );

    // ── Validate images ──
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > this.MAX_IMAGES) {
      throw new BadRequestException(
        `Maximum ${this.MAX_IMAGES} images allowed`,
      );
    }

    // ── Upload images to Cloudinary ──
    const uploadedImages = await this.cloudinaryService.uploadMultipleImages(
      files,
      this.UPLOAD_FOLDER,
    );

    // ── First image is the cover ──
    const images = uploadedImages.map(
      (img: CloudinaryUploadResult, index: number) => ({
        publicId: img.publicId,
        secureUrl: img.secureUrl,
        isCover: index === 0,
      }),
    );

    const result = await this.productRepository.create({
      name: await makeBilingual(createProductDto.name),
      brand: createProductDto.brand.trim(),
      model: createProductDto.model,
      price: createProductDto.price,
      categories: categoryIds,
      specifications: createProductDto.specifications || {},
      images,
      isActive: createProductDto.isActive ?? true,
    });

    return result;
  }

  private readonly LIST_PROJECTION = 'name brand model price categories images specifications isActive createdAt updatedAt';

  async findAll(): Promise<ProductDocument[]> {
    return this.productRepository.findAll(this.LIST_PROJECTION, { isActive: true });
  }

  async findAllAdmin(): Promise<ProductDocument[]> {
    return this.productRepository.findAll(this.LIST_PROJECTION);
  }

  async findById(id: Types.ObjectId): Promise<ProductDocument> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCategory(categoryId: Types.ObjectId): Promise<ProductDocument[]> {
    // ── Validate category exists ──
    await this.categoriesService.findById(categoryId);
    return this.productRepository.findByCategory(categoryId, this.LIST_PROJECTION, { isActive: true });
  }

  async update(
    id: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ): Promise<ProductDocument> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updateData: Record<string, unknown> = {};

    if (updateProductDto.name) updateData.name = await makeBilingual(updateProductDto.name);
    if (updateProductDto.brand !== undefined) updateData.brand = updateProductDto.brand.trim();
    if (updateProductDto.model) updateData.model = updateProductDto.model;
    if (updateProductDto.price !== undefined) updateData.price = updateProductDto.price;
    if (updateProductDto.isActive !== undefined) updateData.isActive = updateProductDto.isActive;

    // ── Merge specifications (add new keys + update existing, keep untouched) ──
    if (updateProductDto.specifications) {
      const existingSpecs = product.specifications || {};
      updateData.specifications = {
        ...existingSpecs,
        ...updateProductDto.specifications,
      };
    }

    // ── Validate & update categories ──
    if (updateProductDto.categories && updateProductDto.categories.length > 0) {
      const categoryIds = await Promise.all(
        updateProductDto.categories.map(async (catId) => {
          const oid = new Types.ObjectId(catId);
          await this.categoriesService.findById(oid);
          return oid;
        }),
      );
      updateData.categories = categoryIds;
    }

    // ── Determine which old images to keep vs delete ──
    let imagesToKeep: { publicId: string; secureUrl: string; isCover: boolean }[] = [];
    let imagesToDelete: string[] = [];

    if (updateProductDto.existingImages !== undefined) {
      // explicit keep-list: delete any old image whose URL is NOT in existingImages
      const keepSet = new Set(updateProductDto.existingImages);
      for (const img of product.images ?? []) {
        if (keepSet.has(img.secureUrl)) {
          imagesToKeep.push({
            publicId: img.publicId,
            secureUrl: img.secureUrl,
            isCover: false, // will be reassigned below
          });
        } else {
          imagesToDelete.push(img.publicId);
        }
      }
    } else {
      // keep everything; nothing to delete
      imagesToKeep = (product.images ?? []).map((img) => ({
        publicId: img.publicId,
        secureUrl: img.secureUrl,
        isCover: img.isCover,
      }));
    }

    // ── Upload new images if provided ──
    if (files && files.length > 0) {
      if (files.length + imagesToKeep.length > this.MAX_IMAGES) {
        throw new BadRequestException(
          `Maximum ${this.MAX_IMAGES} images allowed`,
        );
      }

      const uploadedImages = await this.cloudinaryService.uploadMultipleImages(
        files,
        this.UPLOAD_FOLDER,
      );

      const newImageObjects = uploadedImages.map(
        (img: CloudinaryUploadResult, index: number) => ({
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          isCover: false,
        }),
      );

      imagesToKeep = [...imagesToKeep, ...newImageObjects];
    }

    // ── Delete removed images from Cloudinary (fire-and-forget) ──
    if (imagesToDelete.length > 0) {
      this.cloudinaryService
        .deleteMultipleImages(imagesToDelete)
        .catch((err) =>
          this.logger.error(
            `Background Cloudinary cleanup failed for product ${id}: ${err.message}`,
          ),
        );
    }

    // ── Assign isCover: first image is the cover ──
    if (imagesToKeep.length > 0) {
      imagesToKeep[0].isCover = true;
      updateData.images = imagesToKeep;
    } else {
      updateData.images = [];
    }

    const updated = await this.productRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    // ── Validate product exists ──
    const product = await this.productRepository.findById(id);

    if (!product) {
      this.logger.warn(`Delete attempted on non-existent product ${id}`);
      throw new NotFoundException('Product not found');
    }

    // ── Delete from MongoDB FIRST — respond instantly ──
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      this.logger.warn(`Product ${id} not found during delete (race condition?)`);
      throw new NotFoundException('Product not found');
    }

    this.logger.log(`Product ${id} deleted from MongoDB`);

    // ── Background: Cloudinary cleanup — does NOT block the response ──
    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map((img) => img.publicId);
      setImmediate(() => {
        this.cloudinaryService
          .deleteMultipleImages(publicIds)
          .catch((err) =>
            this.logger.error(
              `Background Cloudinary cleanup failed for product ${id}`,
              err,
            ),
          );
      });
    }
  }
}
