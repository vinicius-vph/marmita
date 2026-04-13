'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MenuItem, Category } from '@/types';

interface Props {
  editing: MenuItem | null;
  category: Category;
  onSaved: () => void;
  onCancel: () => void;
}

export default function MenuForm({ editing, category, onSaved, onCancel }: Props) {
  const t = useTranslations('MenuForm');
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing?.price?.toString() ?? '');
  const [mealDate, setMealDate] = useState(editing?.meal_date ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.image_url ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t('tooBig'));
      e.target.value = '';
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('meal_date', mealDate);
    formData.append('category', category);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (editing) {
      formData.append('existing_image_url', editing.image_url ?? '');
    }

    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/menu/${editing.id}` : '/api/menu';

    const res = await fetch(url, { method, body: formData });

    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json();
      setError(data.error ?? t('errorDefault'));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-[#1a3a3a]">{editing ? t('editTitle') : t('addTitle')}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#1a3a3a] mb-1">{t('name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={category === 'breakfast' ? t('namePlaceholderBreakfast') : t('namePlaceholderMeals')}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#1a3a3a] mb-1">{t('description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ingredientes, acompanhamentos..."
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a3a3a] mb-1">{t('price')}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="8.50"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a3a3a] mb-1">{t('date')}</label>
          <input
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            required
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        {/* Image upload */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#1a3a3a] mb-1">
            {t('photo')}
            <span className="text-[#1a3a3a]/40 font-normal ml-1">{t('photoOptional')}</span>
          </label>

          {imagePreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-stone-200">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized={imageFile !== null}
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 font-bold w-7 h-7 rounded-full shadow flex items-center justify-center text-sm"
                title="Remover imagem"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
              <span className="text-2xl mb-1">🖼️</span>
              <span className="text-sm text-[#1a3a3a]/60">{t('chooseImage')}</span>
              <span className="text-xs text-[#1a3a3a]/40 mt-0.5">{t('formats')}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
        >
          {loading ? t('saving') : editing ? t('update') : t('add')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-stone-300 text-[#1a3a3a]/70 hover:bg-stone-50 font-medium px-5 py-2 rounded-xl text-sm transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
