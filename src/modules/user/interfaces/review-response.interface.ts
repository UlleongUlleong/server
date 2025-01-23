import { Review } from 'src/modules/alcohol/inerfaces/review.interface';
import { Pagination } from '../../../common/interfaces/pagination.interface';

export class ReviewResponse {
  myReviewInfo: Review[];
  pagination: Pagination;
}
