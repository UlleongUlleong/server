import { SetMetadata } from '@nestjs/common';

export const SkipStatusCheck = () => SetMetadata('skipStatusCheck', true);
