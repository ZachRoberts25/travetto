import { Request, Response } from 'express';

import { Controller, Get, Post, Put, Delete } from '@travetto/express';
import { User } from './model';

/**
 * User oriented operations
 */
@Controller('/user')
export class UserController {

  /**
   * Get user by full name
   * @param name {String} User name
   * @returns A user by name
   */
  @Get('/:name')
  async getByName(req: Request, res: Response): Promise<User> {
    return undefined as any;
  }

  /**
 * Get user by age
 * @param age {Number} User age
 * @returns Users by age
 */
  @Get('/age/:age')
  async getByAge(req: Request, res: Response): Promise<User[]> {
    return undefined as any;
  }

  /**
   * Get all users
   * @returns A list of users
   */
  @Get('/')
  async getAll(req: Request, res: Response): Promise<User[]> {
    return undefined as any;
  }

  /**
   * @param req.body {User}
   */
  @Post('/')
  async createUser(req: Request, res: Response): Promise<User> {
    return undefined as any;
  }

  /**
   * Update user by id
   * @param id {Number} User id
   * @param req.body {User} User to update
   */
  @Put('/:id')
  async updateUser(req: Request, res: Response): Promise<void> {

  }
  /**
   * Delete user by id
   * @param id {Number} User id
   */
  @Delete('/:id')
  async removeUser(req: Request, res: Response): Promise<void> {

  }
}