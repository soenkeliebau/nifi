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
}

export interface ConnectionsDialogRequest {
    title: string;
    connections: ConnectionItem[];
    direction: 'upstream' | 'downstream';
}

@Component({
    selector: 'connections-dialog',
    imports: [CommonModule, MatDialogTitle, MatDialogContent, MatButton, MatDialogActions, MatDialogClose, MatTableModule],
    templateUrl: './connections-dialog.component.html',
    styleUrl: './connections-dialog.component.scss'
})
export class ConnectionsDialog extends CloseOnEscapeDialog {
    title: string;
    direction: 'upstream' | 'downstream';
    displayedColumns: string[] = ['componentType', 'relationship', 'actions'];
    dataSource: MatTableDataSource<ConnectionItem>;

    @Output() goToConnection = new EventEmitter<{ connection: ConnectionItem; direction: 'upstream' | 'downstream' }>();

    constructor(@Inject(MAT_DIALOG_DATA) private data: ConnectionsDialogRequest) {
        super();
        this.title = data.title;
        this.direction = data.direction;
        this.dataSource = new MatTableDataSource<ConnectionItem>(data.connections);
    }

    onGoToConnection(connection: ConnectionItem): void {
        this.goToConnection.next({ connection, direction: this.direction });
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