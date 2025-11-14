

import { getDealersForUser, getVisitsForUser } from '../actions';
import { VisitLoggingClient } from './client';


export default async function VisitLoggingPage() {

    const [dealersResult, visitsResult] = await Promise.all([
        getDealersForUser(),
        getVisitsForUser(),
    ]);

    const dealers = dealersResult.success ? dealersResult.data || [] : [];
    const visits = visitsResult.success ? visitsResult.data || [] : [];

    return (
        <VisitLoggingClient dealers={dealers} initialVisits={visits} />
    )
}


