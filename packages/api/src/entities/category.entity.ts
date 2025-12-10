import { Office } from './office.entity';

export interface Category {
  id: string;
  name: string;
  office: Office;
  externalOffice?: Office;
}
