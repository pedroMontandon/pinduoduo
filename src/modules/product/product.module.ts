import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products/list-products.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product/delete-product.use-case';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { ProductTypeOrmEntity } from './infrastructure/persistence/product.typeorm-entity';
import { ProductTypeOrmRepository } from './infrastructure/persistence/product.typeorm-repository';
import { ProductController } from './presentation/controllers/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTypeOrmEntity])],
  controllers: [ProductController],
  providers: [
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductTypeOrmRepository },
  ],
})
export class ProductModule {}
