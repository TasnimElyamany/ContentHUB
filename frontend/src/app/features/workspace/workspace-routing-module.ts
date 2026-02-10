import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspaceList } from './components/workspace-list/workspace-list';
import { WorkspaceDetail } from './components/workspace-detail/workspace-detail';
import { WorkspaceSettings } from './components/workspace-settings/workspace-settings';

const routes: Routes = [
  {
    path: '',
    component: WorkspaceList,
  },
  {
    path: ':id',
    component: WorkspaceDetail,
  },
  {
    path: ':id/settings',
    component: WorkspaceSettings,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceRoutingModule {}
