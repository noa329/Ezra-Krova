import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

@Component({
  selector: 'app-location-map',
  standalone: true,
  template: `<div #mapEl class="map-container" [style.height]="height"></div>`,
  styles: [`
    .map-container { width: 100%; border-radius: 8px; z-index: 0; }
    :host { display: block; }
  `],
})
export class LocationMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() markers: MapMarker[] = [];
  @Input() height = '240px';
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private layerGroup?: L.LayerGroup;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['markers'] && this.map) {
      this.renderMarkers();
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private initMap() {
    if (!this.mapEl?.nativeElement || this.map) return;
    const defaultCenter: L.LatLngExpression = this.markers.length
      ? [this.markers[0].lat, this.markers[0].lng]
      : [31.5, 34.8];

    this.map = L.map(this.mapEl.nativeElement, {
      center: defaultCenter,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);
    this.renderMarkers();
  }

  private renderMarkers() {
    if (!this.map || !this.layerGroup) return;
    this.layerGroup.clearLayers();

    const bounds: L.LatLngExpression[] = [];
    for (const m of this.markers) {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<span style="background:${m.color || '#1976d2'};width:14px;height:14px;border-radius:50%;display:block;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([m.lat, m.lng], { icon });
      if (m.label) marker.bindPopup(m.label);
      marker.addTo(this.layerGroup);
      bounds.push([m.lat, m.lng]);
    }

    if (bounds.length === 1) {
      this.map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] });
    }
  }
}
