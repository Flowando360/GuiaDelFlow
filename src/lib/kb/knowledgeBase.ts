/**
 * Imports estáticos de las 30 hojas de flowando_kb/knowledge_base/. Se
 * importan una por una (en vez de leer el directorio en runtime) para que
 * el bundler las incluya de forma determinística — nada de depender del
 * filesystem en el server de Vercel.
 */
import CARACTER from '../../../flowando_kb/knowledge_base/CARACTER.json';
import Cambios from '../../../flowando_kb/knowledge_base/Cambios.json';
import Compromiso from '../../../flowando_kb/knowledge_base/Compromiso.json';
import Comunicacion from '../../../flowando_kb/knowledge_base/Comunicación.json';
import CualidadesPotencia from '../../../flowando_kb/knowledge_base/CualidadesPotencia.json';
import Dependencia from '../../../flowando_kb/knowledge_base/Dependencia.json';
import DesafioInterior from '../../../flowando_kb/knowledge_base/DesafioInterior.json';
import Desafio_Libera from '../../../flowando_kb/knowledge_base/Desafio_Libera.json';
import Desafio_Sanacion from '../../../flowando_kb/knowledge_base/Desafio_Sanacion.json';
import ETAPA_FLOW from '../../../flowando_kb/knowledge_base/ETAPA_FLOW.json';
import Estabilidad_Emocional from '../../../flowando_kb/knowledge_base/Estabilidad_Emocional.json';
import Felicidad from '../../../flowando_kb/knowledge_base/Felicidad.json';
import Frustracion from '../../../flowando_kb/knowledge_base/Frustración.json';
import Integra from '../../../flowando_kb/knowledge_base/Integra.json';
import Inteligencias from '../../../flowando_kb/knowledge_base/Inteligencias.json';
import Liderazgo_1 from '../../../flowando_kb/knowledge_base/Liderazgo_1.json';
import Liderazgo_2 from '../../../flowando_kb/knowledge_base/Liderazgo_2.json';
import Negociacion from '../../../flowando_kb/knowledge_base/Negociación.json';
import Ninez from '../../../flowando_kb/knowledge_base/Niñez.json';
import Pasado from '../../../flowando_kb/knowledge_base/Pasado.json';
import Pertenencia from '../../../flowando_kb/knowledge_base/Pertenencia.json';
import Proposito_1 from '../../../flowando_kb/knowledge_base/Proposito_1.json';
import Proposito_2 from '../../../flowando_kb/knowledge_base/Proposito_2.json';
import Recursividad from '../../../flowando_kb/knowledge_base/Recursividad.json';
import Responsabilidad from '../../../flowando_kb/knowledge_base/Responsabilidad.json';
import TALENTO_UNICO from '../../../flowando_kb/knowledge_base/TALENTO_UNICO.json';
import TEMPERAMENTO from '../../../flowando_kb/knowledge_base/TEMPERAMENTO.json';
import Talento_Innato from '../../../flowando_kb/knowledge_base/Talento_Innato.json';
import Talento_Potenciar from '../../../flowando_kb/knowledge_base/Talento_Potenciar.json';
import TrabajoEnEquipo from '../../../flowando_kb/knowledge_base/TrabajoEnEquipo.json';

export { questionnaire } from './questionnaire';

/**
 * Los 30 aspectos, indexados por el mismo nombre que usa
 * calculation_order.json (paso_1.aspectos, paso_2/paso_3.aspectos).
 */
export const KNOWLEDGE_BASE = {
  TALENTO_UNICO,
  TEMPERAMENTO,
  CARACTER,
  ETAPA_FLOW,
  Talento_Innato,
  Talento_Potenciar,
  Proposito_1,
  DesafioInterior,
  Desafio_Sanacion,
  Niñez: Ninez,
  Dependencia,
  Pasado,
  Compromiso,
  Responsabilidad,
  Felicidad,
  Cambios,
  TrabajoEnEquipo,
  Liderazgo_1,
  Liderazgo_2,
  Comunicación: Comunicacion,
  Negociación: Negociacion,
  Frustración: Frustracion,
  Recursividad,
  Estabilidad_Emocional,
  Pertenencia,
  Inteligencias,
  Proposito_2,
  Desafio_Libera,
  CualidadesPotencia,
  Integra,
} as const;

export type NombreAspecto = keyof typeof KNOWLEDGE_BASE;
