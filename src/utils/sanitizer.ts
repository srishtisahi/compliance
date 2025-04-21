import { isPlainObject, cloneDeep, set, get } from 'lodash';

// List of sensitive fields to be masked in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'auth',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurity',
  'dob',
  'dateOfBirth',
  'date_of_birth',
  'jwt',
  'key',
  'passphrase',
  'credentials',
  'accountNumber',
  'account_number',
  'signature',
];

// Fields with possible sensitive PII
const PII_FIELDS = [
  'email',
  'address',
  'phone',
  'phoneNumber',
  'phone_number',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'name',
  'username',
  'user_name',
  'document',
  'documentNumber',
  'document_number',
];

// Custom replacement strings
const MASKED_VALUE = '[REDACTED]';
const MASKED_PII_VALUE = '[PII REDACTED]';

/**
 * Sanitizes data by masking sensitive fields
 * @param data - Object to sanitize
 * @param maskPii - Whether to mask PII fields (default: true)
 * @returns Sanitized copy of the data
 */
export const sanitizeData = (data: unknown, maskPii = true): unknown => {
  // Handle null or undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, maskPii));
  }

  // Handle objects (main sanitization)
  if (isPlainObject(data)) {
    const sanitized = cloneDeep(data);
    const processObject = (obj: Record<string, any>, prefix = ''): void => {
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        // Check if key is sensitive
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => 
          lowerKey === field.toLowerCase() || 
          lowerKey.includes(field.toLowerCase())
        );
        
        // Check if key contains PII
        const isPii = maskPii && PII_FIELDS.some(field => 
          lowerKey === field.toLowerCase() || 
          lowerKey.includes(field.toLowerCase())
        );
        
        if (isSensitive) {
          set(sanitized, path, MASKED_VALUE);
        } else if (isPii) {
          set(sanitized, path, MASKED_PII_VALUE);
        } else if (isPlainObject(value)) {
          processObject(value, path);
        } else if (Array.isArray(value)) {
          const sanitizedArray = value.map(item => 
            isPlainObject(item) ? sanitizeData(item, maskPii) : item
          );
          set(sanitized, path, sanitizedArray);
        }
      });
    };
    
    processObject(data as Record<string, any>);
    return sanitized;
  }
  
  // Return data as is for other object types
  return data;
};

/**
 * Sanitizes error objects, removing stack traces and sensitive information in production
 * @param error - Error object to sanitize
 * @returns Sanitized error object
 */
export const sanitizeError = (error: Error): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {
    message: error.message,
    name: error.name,
  };
  
  // Include stack trace only in development environment
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }
  
  // Add any other properties from the error object (but sanitize them)
  Object.getOwnPropertyNames(error).forEach(key => {
    if (!['message', 'name', 'stack'].includes(key)) {
      const value = (error as any)[key];
      sanitized[key] = sanitizeData(value);
    }
  });
  
  return sanitized;
}; 