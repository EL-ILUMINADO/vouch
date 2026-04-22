"use client";

import { useState } from "react";
import { useActionState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNIVERSITY_LOCATIONS,
  type CityConfig,
} from "@/lib/constants/locations";
import { saveLocation, type LocationState } from "./actions";

interface Props {
  universityId: string;
  universityName: string;
}

const initialState: LocationState = {};

export function LocationForm({ universityId, universityName }: Props) {
  const [state, action, isPending] = useActionState(saveLocation, initialState);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [customNeighborhood, setCustomNeighborhood] = useState<string>("");

  const cities: CityConfig[] = UNIVERSITY_LOCATIONS[universityId] ?? [];
  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const isOther = selectedNeighborhood === "Other";

  // The value that gets submitted — custom text wins when "Other" is chosen
  const finalNeighborhood = isOther
    ? customNeighborhood.trim()
    : selectedNeighborhood;

  const canSubmit =
    !isPending &&
    !!selectedCityId &&
    ((!!selectedNeighborhood && !isOther) ||
      (isOther && customNeighborhood.trim().length > 0));

  return (
    <form action={action} className="space-y-5">
      {/* Carries the resolved neighborhood value to the server action */}
      <input type="hidden" name="neighborhood" value={finalNeighborhood} />

      <div className="space-y-2">
        <Label className="text-sm font-semibold">City</Label>
        <Select
          name="city"
          required
          disabled={isPending}
          onValueChange={(val: string | null) => {
            if (val) {
              setSelectedCityId(val);
              setSelectedNeighborhood("");
              setCustomNeighborhood("");
            }
          }}
        >
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder={`City near ${universityName}`} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCity && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Neighborhood</Label>
            <Select
              disabled={isPending}
              value={selectedNeighborhood}
              onValueChange={(val: string | null) => {
                if (val) {
                  setSelectedNeighborhood(val);
                  setCustomNeighborhood("");
                }
              }}
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Pick your area" />
              </SelectTrigger>
              <SelectContent>
                {selectedCity.neighborhoods.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && selectedCity.allowsCustomInput && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <Input
                placeholder="Type your neighborhood…"
                value={customNeighborhood}
                onChange={(e) => setCustomNeighborhood(e.target.value)}
                disabled={isPending}
                className="h-12 rounded-2xl"
                autoFocus
                maxLength={60}
              />
            </div>
          )}
        </div>
      )}

      {state?.error && (
        <p
          className="text-sm font-bold uppercase tracking-tighter text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="w-full h-14 font-bold rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-200/60 dark:shadow-none transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Continue
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
