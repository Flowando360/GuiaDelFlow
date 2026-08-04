/**
 * Import aislado de questionnaire.json, separado de knowledgeBase.ts a
 * propósito: la UI del cuestionario (Client Component) solo necesita esto
 * — si importara desde knowledgeBase.ts también arrastraría las 30 hojas
 * de contenido largo de knowledge_base/ al bundle del navegador.
 */
import questionnaire from '../../../flowando_kb/questionnaire.json';

export { questionnaire };
