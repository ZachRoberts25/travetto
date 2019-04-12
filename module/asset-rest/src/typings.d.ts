import { Asset } from '@travetto/asset';
import { Response } from '@travetto/rest';

declare global {
	namespace Travetto {
		interface Request {
			files: { [key: string]: Asset };
		}
	}
}