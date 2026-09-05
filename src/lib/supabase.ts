import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'ADMIN' | 'KASIR'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          category_id: string | null
          brand: string | null
          unit: string | null
          cost_price: number
          selling_price: number
          stock: number
          minimum_stock: number
          status: string
          created_at: string
          updated_at: string
        }
      }
      services: {
        Row: {
          id: string
          service_code: string
          name: string
          selling_price: number
          active: boolean
          created_at: string
          updated_at: string
        }
      }
      mechanics: {
        Row: {
          id: string
          name: string
          phone: string | null
          status: string
          created_at: string
          updated_at: string
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
        }
      }
      transactions: {
        Row: {
          id: string
          transaction_number: string
          subtotal: number
          discount: number
          total: number
          payment_method: string
          paid_amount: number
          change_amount: number
          cash_session_id: string | null
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          item_type: string
          product_id: string | null
          service_id: string | null
          item_name: string
          sku: string | null
          quantity: number
          unit_price: number
          subtotal: number
          stock_tracked: boolean
          created_at: string
        }
      }
      incomes: {
        Row: {
          id: string
          transaction_id: string | null
          category: string
          amount: number
          payment_method: string
          description: string | null
          date: string
          created_by: string | null
          created_at: string
        }
      }
      expenses: {
        Row: {
          id: string
          expense_number: string
          category: string
          mechanic_id: string | null
          amount: number
          payment_method: string
          description: string | null
          date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
      restocks: {
        Row: {
          id: string
          restock_number: string
          supplier_name: string | null
          total_amount: number
          notes: string | null
          created_by: string | null
          created_at: string
        }
      }
      restock_items: {
        Row: {
          id: string
          restock_id: string
          product_id: string | null
          quantity: number
          cost_price: number
          subtotal: number
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string | null
          movement_type: string
          quantity: number
          stock_before: number
          stock_after: number
          reference_type: string | null
          reference_id: string | null
          reason: string | null
          created_by: string | null
          created_at: string
        }
      }
      cash_sessions: {
        Row: {
          id: string
          opening_balance: number
          cash_sales: number
          cash_expenses: number
          expected_cash: number
          actual_cash: number
          difference: number
          opened_by: string | null
          closed_by: string | null
          opened_at: string
          closed_at: string | null
          status: string
        }
      }
    }
  }
}
