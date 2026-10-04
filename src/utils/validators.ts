/**
 * Centralized Form & Profile Validation Rules
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(sanitized);
}

export function validateIndianMobile(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.replace(/[\s-]/g, '');
  return /^[6-9]\d{9}$/.test(sanitized);
}

export function validateAmount(amount: string | number): boolean {
  if (amount === undefined || amount === null || amount === '') return false;
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

export function validatePositiveAmount(amount: string | number): boolean {
  if (amount === undefined || amount === null || amount === '') return false;
  const num = Number(amount);
  return !isNaN(num) && num >= 0;
}

export function validateDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

export function validatePinCode(pin: string): boolean {
  if (!pin || typeof pin !== 'string') return false;
  const sanitized = pin.replace(/\s/g, '');
  return /^[1-9][0-9]{5}$/.test(sanitized);
}

export function validateChequeNumber(chequeNo: string): boolean {
  if (!chequeNo || typeof chequeNo !== 'string') return false;
  const sanitized = chequeNo.replace(/\s/g, '');
  return /^[A-Za-z0-9]{6,18}$/.test(sanitized);
}

export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > 100) return false;
  return /^[A-Za-z\s.\-']+$/.test(trimmed);
}

export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateField(key: string, label: string, value: unknown, rules?: { required?: boolean; type?: string }): string | null {
  const strVal = String(value || '').trim();
  if (rules?.required && !validateRequired(value)) {
    return `${label} is required.`;
  }
  if (!strVal) return null;

  const lowerKey = key.toLowerCase();

  if (rules?.type === 'email' || lowerKey.includes('email')) {
    if (!validateEmail(strVal)) return `${label} must be a valid email address.`;
  }
  if (rules?.type === 'tel' || lowerKey.includes('phone') || lowerKey.includes('mobile')) {
    if (!validatePhone(strVal)) return `${label} must be a valid phone number (10-15 digits).`;
  }
  if (lowerKey.includes('mobile') && !validateIndianMobile(strVal)) {
    return `${label} must be a valid Indian mobile number (10 digits starting with 6-9).`;
  }
  if (rules?.type === 'number' || lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('rent')) {
    if (!validateAmount(strVal)) return `${label} must be a valid positive number.`;
  }
  if (lowerKey.includes('chequenumber')) {
    if (!validateChequeNumber(strVal)) return `${label} must be 6-18 alphanumeric characters.`;
  }
  if (lowerKey.includes('pincode') || lowerKey.includes('pin_code')) {
    if (!validatePinCode(strVal)) return `${label} must be a valid 6-digit PIN code.`;
  }
  if (lowerKey.includes('name') && !lowerKey.includes('recipientname') && !lowerKey.includes('sendername')) {
    if (!validateName(strVal)) return `${label} contains invalid characters.`;
  }
  if (rules?.type === 'date' || lowerKey.includes('date')) {
    if (!validateDate(strVal)) return `${label} must be a valid date.`;
  }

  return null;
}

export function validateLegalNoticeFields(formData: Record<string, unknown>, noticeType: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields: Record<string, { label: string; required?: boolean; type?: string }> = {
    senderName: { label: 'Sender name', required: true },
    senderAddress: { label: 'Sender address', required: true },
    recipientName: { label: 'Recipient name', required: true },
    recipientAddress: { label: 'Recipient address', required: true },
    subject: { label: 'Subject', required: true },
    description: { label: 'Description', required: true },
    demands: { label: 'Demands', required: true },
    timeline: { label: 'Timeline', required: true },
  };

  if (noticeType === 'cheque_bounce') {
    Object.assign(fields, {
      chequeNumber: { label: 'Cheque number', required: true },
      chequeDate: { label: 'Cheque date', required: true },
      chequeAmount: { label: 'Cheque amount', required: true },
      bankName: { label: 'Bank name', required: true },
      branch: { label: 'Branch', required: true },
      presentationDate: { label: 'Presentation date', required: true },
      dishonourDate: { label: 'Dishonour date', required: true },
      dishonourReason: { label: 'Dishonour reason', required: true },
      returnMemoDate: { label: 'Return memo date', required: true },
      underlyingLiability: { label: 'Underlying liability', required: true },
    });
  }

  if (noticeType === 'tenant_eviction') {
    Object.assign(fields, {
      landlordName: { label: 'Landlord name', required: true },
      tenantName: { label: 'Tenant name', required: true },
      propertyAddress: { label: 'Property address', required: true },
      tenancyAgreementDate: { label: 'Tenancy agreement date', required: true },
      rentAmount: { label: 'Rent amount', required: true },
      arrears: { label: 'Arrears amount', required: true },
      evictionGround: { label: 'Eviction ground', required: true },
      requiredPossessionDate: { label: 'Required possession date', required: true },
    });
  }

  if (noticeType === 'money_recovery') {
    Object.assign(fields, {
      transactionDate: { label: 'Transaction date', required: true },
      transactionType: { label: 'Transaction type', required: true },
      principalAmount: { label: 'Principal amount', required: true },
      totalOutstanding: { label: 'Total outstanding', required: true },
      dueDate: { label: 'Due date', required: true },
    });
  }

  if (noticeType === 'divorce_family') {
    Object.assign(fields, {
      spouseName: { label: 'Spouse name', required: true },
      marriageDate: { label: 'Marriage date', required: true },
      marriagePlace: { label: 'Marriage place', required: true },
      matrimonialResidence: { label: 'Matrimonial residence', required: true },
    });
  }

  if (noticeType === 'employment_dispute') {
    Object.assign(fields, {
      employeeName: { label: 'Employee name', required: true },
      employerName: { label: 'Employer name', required: true },
      designation: { label: 'Designation', required: true },
      disputeType: { label: 'Dispute type', required: true },
      employmentStartDate: { label: 'Employment start date', required: true },
    });
  }

  for (const [key, rule] of Object.entries(fields)) {
    const err = validateField(key, rule.label, formData[key], rule);
    if (err) errors.push({ field: key, message: err });
  }

  return errors;
}

export function validateChequeBounceTimeline(formData: Record<string, unknown>): string | null {
  const chequeDate = new Date(formData.chequeDate as string);
  const presentationDate = new Date(formData.presentationDate as string);
  const dishonourDate = new Date(formData.dishonourDate as string);
  const returnMemoDate = new Date(formData.returnMemoDate as string);

  if (chequeDate >= presentationDate) {
    return 'Cheque date must be before the presentation date.';
  }
  if (presentationDate >= dishonourDate) {
    return 'Presentation date must be before the dishonour date.';
  }
  if (dishonourDate > returnMemoDate) {
    return 'Dishonour date must be on or before the return memo date.';
  }

  const noticeDate = new Date(formData.noticeDate || new Date());
  const daysSinceDishonour = Math.floor((noticeDate.getTime() - dishonourDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceDishonour > 90) {
    return 'Warning: Statutory notice under Section 138 should ideally be sent within 90 days of dishonour. The cause of action may be time-barred. Please consult your advocate.';
  }
  if (daysSinceDishonour < 0) {
    return 'Notice date cannot be before the dishonour date.';
  }

  return null;
}
