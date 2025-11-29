import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef } from '@sass-hub-v2/ui-kit';
import { SettingsService } from '../../services/settings';
import { Category  } from '../../services/news';

@Component({
  selector: 'app-preferences',
  imports: [CommonModule],
  templateUrl: './preferences.component.html'
})
export class PreferencesComponent {
  readonly modalRef = inject(ModalRef<PreferencesComponent>);
  private settingsService = inject(SettingsService);

  readonly categories = this.settingsService.categories;
  readonly selectedTags = this.settingsService.selectedTags;
  readonly saving = this.settingsService.saving;
  
  allIsSelected(sub: Category): boolean {
    if (!sub) return false;
    return sub.children?.every(sub => this.isTagSelected(sub.id)) ?? false;
  } 

  toggleTag(tagId: string) {
    this.selectedTags.update(set => {
        const newSet = new Set(set);
        if (newSet.has(tagId)) {
            newSet.delete(tagId);
            
            // If parent is deselected, optionally deselect children?
            // Or if this is a parent tag, deselect all its children
            const parentCat = this.categories().find(c => c.id === tagId);
            if (parentCat && parentCat.children) {
                parentCat.children.forEach(child => newSet.delete(child.id));
            }

        } else {
            newSet.add(tagId);
            
            // If this is a parent tag, select all its children? 
            // The user requested: "when selecting the tag, deactivate select subtag"
            // This might mean: selecting Parent -> deselects all children (to imply "Everything in Parent").
            // OR selecting Parent -> selects all children?
            // Usually: Parent = "All". If Parent is selected, granular children selections are redundant.
            
            const parentCat = this.categories().find(c => c.id === tagId);
            if (parentCat && parentCat.children) {
                // If we select the parent ("Tout ..."), we remove explicit selection of children
                // because logically "Parent" covers them.
                parentCat.children.forEach(child => newSet.delete(child.id));
            } else {
                // If we select a child, we must ensure the Parent is NOT selected 
                // (otherwise Parent overrides child selection)
                // Find parent of this child
                const parentOfChild = this.categories().find(c => c.children?.some(child => child.id === tagId));
                if (parentOfChild) {
                    newSet.delete(parentOfChild.id);
                }
            }
        }
        return newSet;
    });
  }

  isTagSelected(tagId: string): boolean {
      return this.selectedTags().has(tagId);
  }

 save() {
    this.settingsService.save(this.modalRef);
 }
  
  close() {
      this.modalRef.close();
  }
}

