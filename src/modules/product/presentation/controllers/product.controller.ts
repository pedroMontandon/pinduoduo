import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { CreateProductUseCase } from '../../application/use-cases/create-product/create-product.use-case';
import { CreateProductDto } from '../../application/use-cases/create-product/create-product.dto';
import { GetProductUseCase } from '../../application/use-cases/get-product/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products/list-products.use-case';
import { ListProductsDto } from '../../application/use-cases/list-products/list-products.dto';
import { UpdateProductUseCase } from '../../application/use-cases/update-product/update-product.use-case';
import { UpdateProductDto } from '../../application/use-cases/update-product/update-product.dto';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product/delete-product.use-case';

@Controller('products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  list(@Query() dto: ListProductsDto) {
    return this.listProducts.execute(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  get(@Param('id') id: string) {
    return this.getProduct.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.deleteProduct.execute(id);
  }
}
