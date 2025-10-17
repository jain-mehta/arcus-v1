
import { getDealersForUser, getVisitsForUser } from '../actions';
import { VisitLoggingClient } from './client';


export default async function VisitLoggingPage() {

    const [dealers, visits] = await Promise.all([
        getDealersForUser(),
        getVisitsForUser(),
    ]);

    return (
        <VisitLoggingClient dealers={dealers} initialVisits={visits} />
    )
}
