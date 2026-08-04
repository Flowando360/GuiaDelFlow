/**
 * Tipos escritos a mano a partir de `supabase/migrations/0001_flow_schema.sql`
 * (única migración de esta app hasta ahora).
 *
 * Cuando haya un token de Supabase con acceso al proyecto compartido, esto
 * se puede reemplazar por la versión autogenerada:
 *
 *   npm run db:types
 *
 * — y de ahí en adelante regenerar después de cada migración nueva, en vez
 * de editar este archivo a mano.
 */

export type FlowDocumentoTipo = 'guia' | 'carta';
export type FlowDocumentoEstado = 'pendiente' | 'generando' | 'listo' | 'error';

export interface Database {
  public: {
    Tables: {
      flow_perfiles: {
        Row: {
          id: string;
          nombre_completo: string;
          email: string;
          fecha_nacimiento: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre_completo: string;
          email: string;
          fecha_nacimiento?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre_completo?: string;
          email?: string;
          fecha_nacimiento?: string | null;
          created_at?: string;
        };
      };
      flow_cuestionarios: {
        Row: {
          id: string;
          usuario_id: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          respuestas: Record<string, any>;
          completado_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          respuestas?: Record<string, any>;
          completado_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          respuestas?: Record<string, any>;
          completado_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      flow_resultados: {
        Row: {
          id: string;
          cuestionario_id: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          aspectos: Record<string, any>;
          calculado_at: string;
        };
        Insert: {
          id?: string;
          cuestionario_id: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          aspectos: Record<string, any>;
          calculado_at?: string;
        };
        Update: {
          id?: string;
          cuestionario_id?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          aspectos?: Record<string, any>;
          calculado_at?: string;
        };
      };
      flow_carta_intake: {
        Row: {
          id: string;
          cuestionario_id: string;
          razon: string;
          cuestionamiento_1: string;
          cuestionamiento_2: string;
          cuestionamiento_3: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          cuestionario_id: string;
          razon: string;
          cuestionamiento_1: string;
          cuestionamiento_2: string;
          cuestionamiento_3: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          cuestionario_id?: string;
          razon?: string;
          cuestionamiento_1?: string;
          cuestionamiento_2?: string;
          cuestionamiento_3?: string;
          created_at?: string;
        };
      };
      flow_documentos: {
        Row: {
          id: string;
          cuestionario_id: string;
          tipo: FlowDocumentoTipo;
          estado: FlowDocumentoEstado;
          storage_path: string | null;
          error_detalle: string | null;
          generado_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cuestionario_id: string;
          tipo: FlowDocumentoTipo;
          estado?: FlowDocumentoEstado;
          storage_path?: string | null;
          error_detalle?: string | null;
          generado_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cuestionario_id?: string;
          tipo?: FlowDocumentoTipo;
          estado?: FlowDocumentoEstado;
          storage_path?: string | null;
          error_detalle?: string | null;
          generado_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
