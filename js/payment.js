const PaymentSystem = {
  // Razorpay Key ID
  RAZORPAY_KEY_ID: 'rzp_test_SZISUR4Rb6VK8T', 

  init() {
    this.injectScripts();
    this.bindEvents();
    this.appendSuccessToastHTML();
  },

  injectScripts() {
    // Inject Confetti Script for Success Animation
    if (!document.querySelector('script[src*="canvas-confetti"]')) {
      const confettiScript = document.createElement('script');
      confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      document.head.appendChild(confettiScript);
    }

    // Inject the real Razorpay Checkout script dynamically
    if (!document.querySelector('script[src*="checkout.razorpay.com"]')) {
      const razorpayScript = document.createElement('script');
      razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(razorpayScript);
    }
    
    // Inject minor CSS for loading spinner
    const style = document.createElement('style');
    style.innerHTML = `@keyframes rzp-spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  },

  appendSuccessToastHTML() {
    const html = `
    <div id="paymentSuccessToast" class="payment-toast" style="display: none; position: fixed; bottom: 20px; right: 20px; background: #fff; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; border-left: 4px solid #10b981;">
      <div class="toast-content" style="display: flex; align-items: center; gap: 15px;">
        <i data-feather="check-circle" style="color: #10b981; width: 32px; height: 32px;"></i>
        <div class="toast-text">
          <h4 style="color: #10b981; font-weight: 700; margin: 0 0 5px 0;">Payment Successful!</h4>
          <p id="paymentTransactionId" style="margin: 0; font-size: 0.9rem; color: #555;">Transaction ID: </p>
        </div>
      </div>
    </div>
    `;
    if (!document.getElementById('paymentSuccessToast')) {
      document.body.insertAdjacentHTML('beforeend', html);
    }
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.pay-exam-btn');
      if (trigger) {
        e.preventDefault();
        
        // Prevent multiple clicks
        if (trigger.disabled) return;
        
        const courseId = trigger.getAttribute('data-course-id') || trigger.getAttribute('data-course');
        const originalText = trigger.innerHTML;
        
        // Show loading state on the button
        trigger.disabled = true;
        trigger.innerHTML = '<div style="display:inline-block; width:14px; height:14px; border:2px solid currentcolor; border-right-color:transparent; border-radius:50%; animation:rzp-spin 0.75s linear infinite; margin-right:8px; vertical-align:middle;"></div> Securing Checkout...';
        
        // Slight delay to ensure Razorpay library evaluates
        setTimeout(() => {
            this.openRazorpay(courseId, trigger, originalText);
        }, 400);
      }
    });
  },

  openRazorpay(courseId, triggerElement, originalText) {
    if (typeof window.Razorpay === 'undefined') {
      alert("Payment gateway is still loading. Please check your internet connection and try again.");
      triggerElement.innerHTML = originalText;
      triggerElement.disabled = false;
      return;
    }

    this.currentCourseId = courseId;
    
    // Amount is in currency subunits. 100000 paise = 1000 INR
    const options = {
      "key": this.RAZORPAY_KEY_ID, 
      "amount": "100000", 
      "currency": "INR",
      "name": "SUTU LMS",
      "description": "Exam Registration Fee",
      "image": "../assets/university-logo.png", // Optional: Logo
      "handler": (response) => {
         // Payment was successful!
         this.handleSuccess(response.razorpay_payment_id);
      },
      "prefill": {
        "name": localStorage.getItem("userName") || "",
        "email": localStorage.getItem("userEmail") || "",
        "contact": ""
      },
      "theme": {
        "color": "#1a1a1a" // Match SUTU dark theme
      },
      "modal": {
        "ondismiss": () => {
           // Payment modal closed by the user
           triggerElement.innerHTML = originalText;
           triggerElement.disabled = false;
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response){
          console.error("Payment failed: ", response.error);
          alert("Payment failed: " + response.error.description);
          triggerElement.innerHTML = originalText;
          triggerElement.disabled = false;
      });

      rzp.open();
    } catch (e) {
      console.error("Failed to initialize Razorpay:", e);
      alert("Failed to initialize payment gateway.");
      triggerElement.innerHTML = originalText;
      triggerElement.disabled = false;
    }
  },

  handleSuccess(transactionId) {
    this.runConfetti();
    this.showSuccess(transactionId);
    this.updateTriggerUI();
    // Additional logic to save payment proof to Supabase can be implemented here
  },

  runConfetti() {
    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f5a623', '#1a1a1a']
      });
    }
  },

  showSuccess(transactionId) {
    const toast = document.getElementById('paymentSuccessToast');
    if (!toast) return;

    const txElem = document.getElementById('paymentTransactionId');
    if (txElem && transactionId) {
       txElem.textContent = "Transaction ID: " + transactionId;
    }

    toast.style.display = 'block';
    
    // Add simple animation styles if not present purely by classes
    toast.style.transform = "translateY(20px)";
    toast.style.opacity = "0";
    toast.style.transition = "all 0.4s ease-out";
    
    // Trigger reflow
    void toast.offsetWidth;
    
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";

    if (typeof feather !== 'undefined') feather.replace();

    setTimeout(() => {
      toast.style.transform = "translateY(20px)";
      toast.style.opacity = "0";
      setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 5000);
  },

  updateTriggerUI() {
    const btns = document.querySelectorAll('.pay-exam-btn[data-course-id="'+this.currentCourseId+'"], .pay-exam-btn[data-course="'+this.currentCourseId+'"]');
    btns.forEach(btn => {
      btn.innerHTML = '<i data-feather="check-circle" style="width: 14px; margin-right: 4px;"></i> Registration Complete';
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
      btn.style.backgroundColor = '#10b981';
      btn.style.borderColor = '#10b981';
      btn.style.color = '#fff';
      btn.disabled = true;
      btn.style.cursor = 'default';
    });
    if (typeof feather !== 'undefined') feather.replace();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PaymentSystem.init();
});
