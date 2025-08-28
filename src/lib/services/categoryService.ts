import { createClient } from '@/lib/supabase/client';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/calendar';

class CategoryService {
  private supabase = createClient();

  /**
   * Get all categories for the current user
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        name: input.name,
        color: input.color,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update an existing category
   */
  async updateCategory(input: UpdateCategoryInput): Promise<Category> {
    const { id, ...updateData } = input;

    const { data, error } = await this.supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}

export const categoryService = new CategoryService();