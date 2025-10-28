/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { CloseOnEscapeDialog, ComponentType } from '@nifi/shared';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface ConnectionItem {
    id: string;
    name: string;
    sourceId: string;
    sourceName: string;
    sourceType: string;
    sourceComponentType: string;
    sourceGroupId: string;
    destinationId: string;
    destinationName: string;
    destinationType: string;
    destinationComponentType: string;
    destinationGroupId: string;
    relationships: string[];
    distance?: number; // Distance from the selected component (0 for direct connections, 1+ for transitive)
}

export interface ConnectionsDialogRequest {
    title: string;
    connections: ConnectionItem[];
    direction: 'upstream' | 'downstream';
}

@Component({
    selector: 'connections-dialog',
    imports: [CommonModule, MatDialogTitle, MatDialogContent, MatButton, MatDialogActions, MatDialogClose, MatTableModule, MatCheckbox, FormsModule],
    templateUrl: './connections-dialog.component.html',
    styleUrl: './connections-dialog.component.scss'
})
export class ConnectionsDialog extends CloseOnEscapeDialog {
    title: string;
    direction: 'upstream' | 'downstream';
    displayedColumns: string[] = ['distance', 'componentType', 'relationship', 'actions'];
    dataSource: MatTableDataSource<ConnectionItem>;
    allConnections: ConnectionItem[];
    showTransitive: boolean = false;

    @Output() goToConnection = new EventEmitter<{ connection: ConnectionItem; direction: 'upstream' | 'downstream' }>();
    @Output() toggleTransitive = new EventEmitter<boolean>();

    private directConnections: ConnectionItem[] = [];
    private transitiveConnections: ConnectionItem[] = [];

    constructor(@Inject(MAT_DIALOG_DATA) private data: ConnectionsDialogRequest) {
        super();
        this.title = data.title;
        this.direction = data.direction;
        this.directConnections = data.connections;
        this.allConnections = data.connections;
        this.dataSource = new MatTableDataSource<ConnectionItem>(this.sortConnections(data.connections));
    }

    onGoToConnection(connection: ConnectionItem): void {
        this.goToConnection.next({ connection, direction: this.direction });
    }

    onToggleTransitive(checked: boolean): void {
        this.showTransitive = checked;
        this.toggleTransitive.emit(checked);
    }

    setDirectConnections(connections: ConnectionItem[]): void {
        this.directConnections = connections;
        if (!this.showTransitive) {
            this.dataSource.data = this.sortConnections(connections);
        }
    }

    setTransitiveConnections(connections: ConnectionItem[]): void {
        this.transitiveConnections = connections;
        if (this.showTransitive) {
            const allConnections = [...this.directConnections, ...connections];
            this.dataSource.data = this.sortConnections(allConnections);
        }
    }

    private sortConnections(connections: ConnectionItem[]): ConnectionItem[] {
        return connections.sort((a, b) => {
            const distanceA = a.distance ?? 0;
            const distanceB = b.distance ?? 0;

            // For downstream: sort ascending (selected component at top with distance 0)
            // For upstream: sort descending (selected component at bottom with highest distance)
            if (this.direction === 'downstream') {
                return distanceA - distanceB;
            } else {
                return distanceB - distanceA;
            }
        });
    }

    getComponentType(connection: ConnectionItem, direction: 'source' | 'destination'): string {
        if (direction === 'source') {
            // Extract simple type name from fully qualified name (e.g., "org.apache.nifi.processors.standard.GetFile" -> "GetFile")
            const typeParts = connection.sourceComponentType.split('.');
            return typeParts[typeParts.length - 1];
        } else {
            const typeParts = connection.destinationComponentType.split('.');
            return typeParts[typeParts.length - 1];
        }
    }

    getRelationshipNames(connection: ConnectionItem): string {
        return connection.relationships.join(', ');
    }
}