import { locationConfig } from "@/lib/location/config";
import type { LocationCoordinates } from "@/types/location";

const EARTH_RADIUS_METERS = 6_371_000;

export function isValidCoordinates(
  value: LocationCoordinates | null | undefined,
): value is LocationCoordinates {
  return Boolean(
    value &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180,
  );
}

/** Kuş uçuşu mesafeyi metre cinsinden döndürür. */
export function haversineDistanceMeters(
  first: LocationCoordinates,
  second: LocationCoordinates,
): number | null {
  if (!isValidCoordinates(first) || !isValidCoordinates(second)) return null;
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function formatDistanceTr(distanceMeters: number | null): string | null {
  if (
    distanceMeters === null ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0
  )
    return null;
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  const kilometers = distanceMeters / 1_000;
  if (kilometers < 100)
    return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(kilometers)} km`;
  return `${Math.round(kilometers)} km`;
}

export function isLocationStale(
  updatedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!updatedAt) return true;
  const timestamp = new Date(updatedAt).getTime();
  return (
    !Number.isFinite(timestamp) || now - timestamp > locationConfig.staleAfterMs
  );
}
