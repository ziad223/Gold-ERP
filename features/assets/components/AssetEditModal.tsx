"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { Asset, AssetType } from "@/lib/types";

interface AssetEditModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
  onSave: (updates: Partial<Asset>) => void;
}

export function AssetEditModal({ open, onClose, asset, onSave }: AssetEditModalProps) {
  const t = useTranslations("AssetDetails");
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: asset.name,
      category: asset.category,
      type: asset.type,
      karat: asset.karat || 18,
      grossWeight: asset.grossWeight,
      price: asset.price,
      cost: asset.cost,
      location: asset.location,
      stones: asset.stones || 0,
      pearls: asset.pearls || 0,
      notes: asset.notes || "",
    }
  });

  const onSubmit = (data: any) => {
    const updates: Partial<Asset> = {
      name: data.name,
      category: data.category,
      grossWeight: Number(data.grossWeight) || 0,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      location: data.location,
      stones: Number(data.stones) || 0,
      pearls: Number(data.pearls) || 0,
      notes: data.notes,
    };
    if (!asset.barcode) {
      updates.type = data.type as AssetType;
      updates.karat = Number(data.karat) || undefined;
    }
    onSave(updates);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("editAsset")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block label-base mb-1 font-bold">{t("name")}</label>
            <input
              type="text"
              className="input-base text-xs"
              {...register("name", { required: true })}
            />
            {errors.name && <p className="text-rose-500 text-[10px] mt-0.5">{t("required")}</p>}
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("category")}</label>
            <input
              type="text"
              className="input-base text-xs"
              {...register("category", { required: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block label-base mb-1 font-bold">{t("type")}</label>
            <NativeSelect className="text-xs" {...register("type")} disabled={Boolean(asset.barcode)}>
              <option value="gold-piece">{t("typeGoldPiece")}</option>
              <option value="gold-weight">{t("typeGoldWeight")}</option>
              <option value="diamond">{t("typeDiamond")}</option>
              <option value="gemstone">{t("typeGemstone")}</option>
              <option value="pearl">{t("typePearl")}</option>
              <option value="watch">{t("typeWatch")}</option>
            </NativeSelect>
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("karat")}</label>
            <NativeSelect className="text-xs" {...register("karat")} disabled={Boolean(asset.barcode)}>
              <option value="24">24K</option>
              <option value="22">22K</option>
              <option value="21">21K</option>
              <option value="18">18K</option>
            </NativeSelect>
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("location")}</label>
            <input
              type="text"
              className="input-base text-xs"
              {...register("location", { required: true })}
            />
          </div>
        </div>

        {asset.barcode && (
          <p className="text-[10px] font-bold text-amber-600">
            Used barcode identity is locked; type and karat cannot be changed.
          </p>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block label-base mb-1 font-bold">{t("grossWeight")}</label>
            <input
              type="number"
              step="any"
              className="input-base text-xs"
              {...register("grossWeight", { required: true })}
            />
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("salePrice")}</label>
            <input
              type="number"
              className="input-base text-xs"
              {...register("price", { required: true })}
            />
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("costLabel")}</label>
            <input
              type="number"
              className="input-base text-xs"
              {...register("cost", { required: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block label-base mb-1 font-bold">{t("stonesCount")}</label>
            <input
              type="number"
              className="input-base text-xs"
              {...register("stones")}
            />
          </div>
          <div>
            <label className="block label-base mb-1 font-bold">{t("pearlsCount")}</label>
            <input
              type="number"
              className="input-base text-xs"
              {...register("pearls")}
            />
          </div>
        </div>

        <div>
          <label className="block label-base mb-1 font-bold">{t("notes")}</label>
          <textarea
            rows={3}
            className="input-base text-xs h-auto py-2"
            {...register("notes")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit">
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
