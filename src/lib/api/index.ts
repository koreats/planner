import { createClient } from '@/lib/supabase/client';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Base API client for making authenticated requests
 */
export class ApiClient {
  private supabase = createClient();

  /**
   * Generic GET request
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const response = await fetch(`${url}${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        })
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, body?: any): Promise<T> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        })
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, body?: any): Promise<T> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        })
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        })
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();