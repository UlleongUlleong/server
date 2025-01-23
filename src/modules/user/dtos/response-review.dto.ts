import { ResPonseCursorDto } from 'src/modules/alcohol/dtos/response-cursor.dto';
import { ReviewDto } from 'src/modules/alcohol/dtos/review.dto';

export class ResPonseReviewDto {
  myReviewInfo: ReviewDto[];
  meta: ResPonseCursorDto;
}
