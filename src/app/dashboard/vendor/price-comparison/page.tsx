import { PriceComparisonClient } from './client';
import { getAllMaterials, fetchPriceComparisonData } from './actions';

export default async function PriceComparisonPage() {
    const materialsResult = await getAllMaterials();
    const materials = materialsResult.success ? ((materialsResult.data as any) || []) : [];
    
    const initialMaterial = (materials as any)[0] || '';

    let initialComparisonData: any = [];
    if (initialMaterial) {
        const comparisonResult = await fetchPriceComparisonData(initialMaterial);
        initialComparisonData = comparisonResult.success ? ((comparisonResult.data as any) || []) : [];
    }
    
    return (
        <PriceComparisonClient 
            materials={materials} 
            initialComparisonData={initialComparisonData}
            initialMaterial={initialMaterial}
        />
    );
}

