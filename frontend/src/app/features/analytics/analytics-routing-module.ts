import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnalyticsDashboard } from './components/analytics-dashboard/analytics-dashboard';

const routes: Routes = [
  { path: '', component: AnalyticsDashboard },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule { }
