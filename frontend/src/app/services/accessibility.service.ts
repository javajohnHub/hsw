import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private announcementElement: HTMLElement | null = null;

  constructor() {
    // Get the announcement element when the service is initialized
    this.announcementElement = document.getElementById('screen-reader-announcements');
  }

  /**
   * Announce text to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcementElement) {
      this.announcementElement = document.getElementById('screen-reader-announcements');
    }

    if (this.announcementElement) {
      this.announcementElement.setAttribute('aria-live', priority);
      this.announcementElement.textContent = message;
      
      // Clear the message after a short delay
      setTimeout(() => {
        if (this.announcementElement) {
          this.announcementElement.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Set focus to an element by ID
   * @param elementId - The ID of the element to focus
   */
  focusElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }

  /**
   * Set focus to the first focusable element in a container
   * @param containerId - The ID of the container
   */
  focusFirstElement(containerId: string): void {
    const container = document.getElementById(containerId);
    if (container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }

  /**
   * Generate a unique ID for accessibility attributes
   * @param prefix - Optional prefix for the ID
   */
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
