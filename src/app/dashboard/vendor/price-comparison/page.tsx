import { PriceComparisonClient } from './client';
import { getAllMaterials, fetchPriceComparisonData } from './actions';

export default async function PriceComparisonPage() {
    const materials = await getAllMaterials();
    
    const initialMaterial = materials[0] || '';

    const initialComparisonData = initialMaterial 
        ? await fetchPriceComparisonData(initialMaterial) 
        : [];
    
    return (
        <PriceComparisonClient 
            materials={materials} 
            initialComparisonData={initialComparisonData}
            initialMaterial={initialMaterial}
        />
    );
}
