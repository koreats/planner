import { createClient } from '@/lib/supabase/client';
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
} from '@/types/calendar';

class EventService {
  private supabase = createClient();

  /**
   * Get all events for the current user with optional filters
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    let query = this.supabase
      .from('events')
      .select(`
        *,
        category:categories(*)
      `)
      .order('start_date', { ascending: true });

    // Apply filters
    if (filters?.startDate) {
      query = query.gte('end_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_date', filters.endDate);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.searchTerm) {
      query = query.ilike('title', `%${filters.searchTerm}%`);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(this.transformEvent);
  }

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return this.transformEvent(data);
  }

  /**
   * Create a new event
   */
  async createEvent(input: CreateEventInput): Promise<Event> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const eventData = {
      title: input.title,
      description: input.description,
      start_date: this.toISOString(input.startDate),
      end_date: this.toISOString(input.endDate),
      all_day: input.allDay || false,
      category_id: input.categoryId,
      tags: input.tags || [],
      color: input.color,
      user_id: user.id,
    };

    const { data, error } = await this.supabase
      .from('events')
      .insert(eventData)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return this.transformEvent(data);
  }

  /**
   * Update an existing event
   */
  async updateEvent(input: UpdateEventInput): Promise<Event> {
    const { id, ...updateData } = input;

    const eventData: any = {};
    
    if (updateData.title !== undefined) eventData.title = updateData.title;
    if (updateData.description !== undefined) eventData.description = updateData.description;
    if (updateData.startDate !== undefined) eventData.start_date = this.toISOString(updateData.startDate);
    if (updateData.endDate !== undefined) eventData.end_date = this.toISOString(updateData.endDate);
    if (updateData.allDay !== undefined) eventData.all_day = updateData.allDay;
    if (updateData.categoryId !== undefined) eventData.category_id = updateData.categoryId;
    if (updateData.tags !== undefined) eventData.tags = updateData.tags;
    if (updateData.color !== undefined) eventData.color = updateData.color;

    const { data, error } = await this.supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return this.transformEvent(data);
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Transform database record to Event type
   */
  private transformEvent(data: any): Event {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      allDay: data.all_day,
      categoryId: data.category_id,
      category: data.category,
      tags: data.tags || [],
      color: data.color,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Convert date to ISO string format
   */
  private toISOString(date: string | Date): string {
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return date.toISOString();
  }
}

export const eventService = new EventService();