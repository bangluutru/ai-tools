import { VnptProviderAdapter } from './vnpt.js';
import { ViettelProviderAdapter } from './viettel.js';
import { MisaProviderAdapter } from './misa.js';
import { EasyInvoiceProviderAdapter } from './easyinvoice.js';
import { FptProviderAdapter } from './fpt.js';
import { BkavProviderAdapter } from './bkav.js';
import { HiloProviderAdapter } from './hilo.js';
import { ThaisonProviderAdapter } from './thaison.js';
import { PetrolimexProviderAdapter } from './petrolimex.js';
import { MinvoiceProviderAdapter } from './minvoice.js';
import { GenericProviderAdapter } from './generic.js';

export const PROVIDER_ADAPTERS = [
  new VnptProviderAdapter(),
  new ViettelProviderAdapter(),
  new MisaProviderAdapter(),
  new EasyInvoiceProviderAdapter(),
  new FptProviderAdapter(),
  new BkavProviderAdapter(),
  new HiloProviderAdapter(),
  new ThaisonProviderAdapter(),
  new PetrolimexProviderAdapter(),
  new MinvoiceProviderAdapter(),
  new GenericProviderAdapter(), // Fallback must always be last
];

/**
 * Detects the matching e-invoice provider adapter based on candidate URL and text.
 * @param {string} url
 * @param {string} text
 * @returns {BaseProviderAdapter}
 */
export function detectProvider(url, text) {
  for (const adapter of PROVIDER_ADAPTERS) {
    if (adapter.match(url, text)) {
      return adapter;
    }
  }
  return PROVIDER_ADAPTERS[PROVIDER_ADAPTERS.length - 1]; // Generic
}

/**
 * Returns adapter by its unique id
 * @param {string} id
 * @returns {BaseProviderAdapter}
 */
export function getProviderById(id) {
  return (
    PROVIDER_ADAPTERS.find((p) => p.id === id) ||
    PROVIDER_ADAPTERS[PROVIDER_ADAPTERS.length - 1]
  );
}
