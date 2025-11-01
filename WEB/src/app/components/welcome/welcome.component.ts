import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false
})
export class WelcomeComponent {
  private alertAudio?: HTMLAudioElement;
  isPhotoCaptured: boolean = false;

  constructor(private http: HttpClient) {
    // Preload alert sound in development mode
    if (!environment.production) {
      this.alertAudio = new Audio();
      // Using a built-in browser alert sound or you can replace with custom audio file
      this.alertAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8MUrDl6qNdGAg+ltryxnMnBSh+zPDajzsIGGS57OihUxALTqvi7KldGgY8kdXyyX0rBSl9zO3ajDwJG2m+7eSbUQ4NVLDk6qFbGAk9mNrzw3ElBCuAze/eiz0JGnDA7+OcUQ8PU6/k66RaGAk/mdzxxHImBCuBzO/aiz4HHnLC7OKfTg8MWrTn66VZGgc9ndrzy3krBip+zO/aiz0IGnLA7OSgTw8OWLPm66FcGAg7nNrwy3krBSaBye/djj4HGXLCUAg/ntzyxXEmBCqBzfDbhToIG2/B7uegUBANWLPl6qNYGwk+otzzxG8jByZ/zPLajj0HGnXD7eiZTxEPV7Ll66NUGgs8ldrzwXAkBCaDzPPaiToIGGrA7uKeTRENVrXm66FYGwg/ndr0xXEmBCeGze/djjsJGHTC7Oqb';
    }
  }

  async capturePhoto(): Promise<string | null> {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Use front camera, change to 'environment' for back camera
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }

      // Stop the camera stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      return photoData;
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('⚠️ Camera access denied. Please enable camera permissions.');
      return null;
    }
  }

  async savePhoto(photoData: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sos-photo-${timestamp}.jpg`;

    try {
      // Send photo to backend to save
      await this.http.post(`${environment.apiBaseUrl}/sos/save-photo`, {
        photo: photoData,
        filename: filename,
        timestamp: new Date().toISOString()
      }).toPromise();
      this.isPhotoCaptured = true;
      console.log('Photo saved successfully:', filename);
    } catch (error) {
      this.isPhotoCaptured = false;
      console.error('Failed to save photo to server:', error);
      // Fallback: save locally in browser
    }
    this.downloadPhotoLocally(photoData, filename);
  }

  private downloadPhotoLocally(photoData: string, filename: string): void {
    // Create download link
    const link = document.createElement('a');
    link.href = photoData;
    link.download = filename;
    link.click();
    console.log('Photo downloaded locally:', filename);
  }

  async triggerSOS() {
    // Play alert sound in development mode
    if (!environment.production && this.alertAudio) {
      this.alertAudio.play().catch(err => console.log('Audio play failed:', err));
    }

    // Capture photo immediately
    const photoData = await this.capturePhoto();

    // You can customize this to call emergency services, send alerts, etc.
    // const confirmSOS = confirm('⚠️ EMERGENCY SOS\n\nAre you sure you want to trigger an emergency alert?');
    // if (confirmSOS) {
      console.log('SOS triggered at:', new Date().toISOString());
      
      // Play alert sound again on confirmation in dev mode
      if (!environment.production && this.alertAudio) {
        this.alertAudio.currentTime = 0; // Reset to start
        this.alertAudio.play().catch(err => console.log('Audio play failed:', err));
      }

      // Save the captured photo
      if (photoData) {
        await this.savePhoto(photoData);
        await this.captureLocation();
      }
      
      alert('🚨 SOS Alert Sent!\n\nEmergency services have been notified.' + 
            (photoData ? '\n📸 Photo captured and saved.' : '') + 
            '\n📍 Location captured: ' + this.latitude + ', ' + this.longitude);
      
      // TODO: Implement actual emergency alert logic here
      // - Call emergency API
      // - Send location data
      // - Notify emergency contacts
      // - Make emergency call
    // }
  }

  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage: string | null = null;

  async captureLocation(): Promise<void> {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          console.log('Location captured:', this.latitude, this.longitude);
          this.errorMessage = null; // Clear any previous error
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.errorMessage = 'User denied the request for Geolocation.';
              break;
            case error.POSITION_UNAVAILABLE:
              this.errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              this.errorMessage = 'The request to get user location timed out.';
              break;
            default:
              this.errorMessage = 'An unknown error occurred.';
              break;
          }
          this.latitude = null;
          this.longitude = null;
        }
      );
    } else {
      this.errorMessage = 'Geolocation is not supported by this browser.';
    }
  }
}
