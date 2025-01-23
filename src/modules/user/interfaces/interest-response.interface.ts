import { AlcoholSummary } from './alcohol-summary.interface';
import { Pagination } from '../../../common/interfaces/pagination.interface';

export interface InterestResponse {
  alcoholInfo: AlcoholSummary[];
  pagination: Pagination;
}
