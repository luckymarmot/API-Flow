import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'

import RAMLSerializer from '../Serializer'

@registerTest
@against(RAMLSerializer)
export class TestRAMLSerializer extends UnitTest {

    @targets('serialize')
    testSerialize() {
        // TODO
    }
}
