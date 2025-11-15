// pages/email-test.tsx (Next.js) or components/EmailTest.tsx (React)
"use client";
import { useState, useEffect } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  timestamp?: string;
  verificationCode?: string;
  error?: string;
}

export default function EmailTestPage() {
  // Set page title and description
  useEffect(() => {
    document.title = 'Email Test - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Test email service integration and verify email delivery');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Test email service integration and verify email delivery';
      document.head.appendChild(meta);
    }
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const sendTestEmail = async (type: 'welcome' | 'verification') => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/brevo/email/test-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      setResults(prev => [{
        ...result,
        type: type
      }, ...prev]);

      if (result.success) {
        alert(`${type} email sent successfully!`);
      } else {
        alert(`Failed to send ${type} email: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setResults(prev => [{
        success: false,
        message: 'Network error occurred',
        error: error.message,
        type: type
      }, ...prev]);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const fillSampleData = () => {
    setFormData({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    });
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>
          📧 Email Service Tester
        </h1>
        <p style={{ margin: '0', opacity: '0.9' }}>
          Test your Brevo email service integration
        </p>
      </div>

      {/* Test Form */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: '0', color: '#333' }}>Test Email Form</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            First Name:
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Enter first name"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Last Name:
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Enter last name"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Enter email address"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => sendTestEmail('welcome')}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Sending...' : 'Send Welcome Email'}
          </button>

          <button
            onClick={() => sendTestEmail('verification')}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>

          <button
            onClick={fillSampleData}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Fill Sample Data
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: '0', color: '#333' }}>Test Results</h2>
            <button
              onClick={clearResults}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Clear Results
            </button>
          </div>

          {results.map((result: any, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                margin: '10px 0',
                borderRadius: '5px',
                border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
                background: result.success ? '#d4edda' : '#f8d7da'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <strong style={{ 
                  color: result.success ? '#155724' : '#721c24',
                  textTransform: 'capitalize'
                }}>
                  {result.type} Email Test {result.success ? 'SUCCESS' : 'FAILED'}
                </strong>
                <small style={{ color: '#666' }}>
                  {result.timestamp && new Date(result.timestamp).toLocaleString()}
                </small>
              </div>
              
              <p style={{ 
                margin: '5px 0',
                color: result.success ? '#155724' : '#721c24'
              }}>
                {result.message}
              </p>

              {result.verificationCode && (
                <p style={{ 
                  margin: '5px 0',
                  color: '#155724',
                  fontWeight: 'bold'
                }}>
                  Verification Code: {result.verificationCode}
                </p>
              )}

              {result.error && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: '#721c24' }}>
                    View Error Details
                  </summary>
                  <pre style={{ 
                    background: '#f1f1f1', 
                    padding: '10px', 
                    borderRadius: '3px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {result.error}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#e9ecef',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '30px'
      }}>
        <h3 style={{ marginTop: '0', color: '#495057' }}>How to Use:</h3>
        <ol style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <li>Fill in the form with test recipient details</li>
          <li>Click "Send Welcome Email" to test the welcome email template</li>
          <li>Click "Send Verification Email" to test the verification email template</li>
          <li>Check your email inbox for the test emails</li>
          <li>Review the results below to see if emails were sent successfully</li>
        </ol>
        
        <p style={{ 
          color: '#856404', 
          background: '#fff3cd', 
          padding: '10px', 
          borderRadius: '5px',
          margin: '10px 0 0 0',
          border: '1px solid #ffeaa7'
        }}>
          <strong>Note:</strong> Make sure your Brevo API key is properly configured in your backend.
          Check the browser console and server logs for detailed error information.
        </p>
      </div>
    </div>
  );
}

// Alternative: Simple HTML version if not using React
/*
<!DOCTYPE html>
<html>
<head>
    <title>Email Service Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .form-group { 
            margin-bottom: 15px; 
        }
        label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: bold; 
        }
        input { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
        }
        button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin-right: 10px;
        }
        button:disabled { 
            background: #ccc; 
            cursor: not-allowed; 
        }
        .result { 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .success { 
            background: #d4edda; 
            border: 2px solid #28a745; 
            color: #155724; 
        }
        .error { 
            background: #f8d7da; 
            border: 2px solid #dc3545; 
            color: #721c24; 
        }
    </style>
</head>
<body>
    <h1>📧 Email Service Tester</h1>
    
    <div class="form-group">
        <label>First Name:</label>
        <input type="text" id="firstName" placeholder="Enter first name">
    </div>
    
    <div class="form-group">
        <label>Last Name:</label>
        <input type="text" id="lastName" placeholder="Enter last name">
    </div>
    
    <div class="form-group">
        <label>Email:</label>
        <input type="email" id="email" placeholder="Enter email address">
    </div>
    
    <button onclick="sendTestEmail('welcome')">Send Welcome Email</button>
    <button onclick="sendTestEmail('verification')">Send Verification Email</button>
    <button onclick="fillSample()">Fill Sample Data</button>
    
    <div id="results"></div>

    <script>
        async function sendTestEmail(type) {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            
            if (!firstName || !lastName || !email) {
                alert('Please fill all fields');
                return;
            }
            
            try {
                const response = await fetch(`http://localhost:5000/api/brevo/email/test-${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email })
                });
                
                const result = await response.json();
                displayResult(result, type);
                
            } catch (error) {
                displayResult({ success: false, message: error.message }, type);
            }
        }
        
        function displayResult(result, type) {
            const resultsDiv = document.getElementById('results');
            const resultDiv = document.createElement('div');
            resultDiv.className = `result ${result.success ? 'success' : 'error'}`;
            resultDiv.innerHTML = `
                <strong>${type.toUpperCase()} Email: ${result.success ? 'SUCCESS' : 'FAILED'}</strong><br>
                ${result.message}
                ${result.verificationCode ? `<br><strong>Code: ${result.verificationCode}</strong>` : ''}
            `;
            resultsDiv.insertBefore(resultDiv, resultsDiv.firstChild);
        }
        
        function fillSample() {
            document.getElementById('firstName').value = 'John';
            document.getElementById('lastName').value = 'Doe';
            document.getElementById('email').value = 'john.doe@example.com';
        }
    </script>
</body>
</html>
*/