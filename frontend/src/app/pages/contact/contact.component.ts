import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  errors?: any[];
}

interface ServiceOption {
  id: string;
  name: string;
  description: string;
}

interface BudgetOption {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;

  readonly businessName: string = environment.business.name;
  readonly contactEmail: string = environment.contact.email;
  readonly businessHours: string = environment.contact.businessHours;
  readonly businessAddress: string = environment.contact.address;

  readonly serviceOptions: ServiceOption[] = [
    {
      id: 'website-development',
      name: 'Custom Website Development',
      description: 'Professional, responsive websites tailored to your business needs'
    },
    {
      id: 'web-application',
      name: 'Web Application Development',
      description: 'Complex web applications with advanced functionality'
    },
    {
      id: 'e-commerce',
      name: 'E-commerce Solutions',
      description: 'Complete online stores with payment processing'
    },
    {
      id: 'maintenance',
      name: 'Website Maintenance & Support',
      description: 'Ongoing support and optimization for existing websites'
    },
    {
      id: 'consultation',
      name: 'Web Development Consultation',
      description: 'Expert advice on web development strategy'
    },
    {
      id: 'other',
      name: 'Other Services',
      description: 'Custom solutions for unique requirements'
    }
  ];

  readonly budgetOptions: BudgetOption[] = [
    {
      id: 'under-5k',
      name: 'Under $5,000',
      description: 'Small business websites and basic functionality'
    },
    {
      id: '5k-10k',
      name: '$5,000 - $10,000',
      description: 'Professional websites with custom features'
    },
    {
      id: '10k-25k',
      name: '$10,000 - $25,000',
      description: 'Advanced websites and web applications'
    },
    {
      id: '25k-50k',
      name: '$25,000 - $50,000',
      description: 'Complex e-commerce and enterprise solutions'
    },
    {
      id: 'over-50k',
      name: 'Over $50,000',
      description: 'Large-scale enterprise applications'
    },
    {
      id: 'discuss',
      name: 'Prefer to Discuss',
      description: 'Let\'s talk about your specific requirements'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.contactForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]],
      phone: ['', [
        Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)
      ]],
      company: ['', [
        Validators.maxLength(100)
      ]],
      service: ['', [
        Validators.required
      ]],
      budget: [''],
      message: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';
    this.submitSuccess = false;

    try {
      const formData: ContactFormData = this.contactForm.value;
      
      console.log('Submitting contact form to Edwards Web Development');
      
      const response = await this.http.post<ContactResponse>(
        `${environment.apiUrl}/contact/send`,
        formData
      ).toPromise();

      if (response?.success) {
        this.submitSuccess = true;
        this.submitMessage = response.message;
        this.contactForm.reset();
        console.log('Contact form submitted successfully');
      } else {
        this.submitSuccess = false;
        this.submitMessage = response?.message || 'Failed to send message. Please try again.';
      }

    } catch (error: any) {
      console.error('Contact form submission error:', error);
      this.submitSuccess = false;
      
      if (error.status === 400 && error.error?.errors) {
        this.submitMessage = 'Please correct the validation errors and try again.';
      } else if (error.status === 0) {
        this.submitMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        this.submitMessage = 'Failed to send message. Please try again or contact us directly.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    
    if (field?.touched && field?.errors) {
      const errors = field.errors;
      
      if (errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (errors['email']) {
        return 'Please enter a valid email address';
      }
      if (errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
      }
      if (errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
      }
      if (errors['pattern']) {
        if (fieldName === 'name') {
          return 'Name can only contain letters, spaces, apostrophes, and hyphens';
        }
        if (fieldName === 'phone') {
          return 'Please enter a valid phone number';
        }
      }
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      service: 'Service',
      budget: 'Budget',
      message: 'Message'
    };
    
    return fieldNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.touched && field?.errors);
  }

  onServiceChange(): void {
    const selectedService = this.contactForm.get('service')?.value;
    console.log('Service selected:', selectedService);
  }

  onBudgetChange(): void {
    const selectedBudget = this.contactForm.get('budget')?.value;
    console.log('Budget selected:', selectedBudget);
  }
}
